PGDMP      (        
    
    |            image_marks    17.0    17.0     �           0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                           false            �           0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                           false            �           0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                           false            �           1262    16388    image_marks    DATABASE     ~   CREATE DATABASE image_marks WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'English_India.1252';
    DROP DATABASE image_marks;
                     postgres    false            �            1259    16390    marks    TABLE     n   CREATE TABLE public.marks (
    id integer NOT NULL,
    name character varying(50),
    coordinates jsonb
);
    DROP TABLE public.marks;
       public         heap r       postgres    false            �            1259    16389    marks_id_seq    SEQUENCE     �   CREATE SEQUENCE public.marks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 #   DROP SEQUENCE public.marks_id_seq;
       public               postgres    false    218            �           0    0    marks_id_seq    SEQUENCE OWNED BY     =   ALTER SEQUENCE public.marks_id_seq OWNED BY public.marks.id;
          public               postgres    false    217            W           2604    16393    marks id    DEFAULT     d   ALTER TABLE ONLY public.marks ALTER COLUMN id SET DEFAULT nextval('public.marks_id_seq'::regclass);
 7   ALTER TABLE public.marks ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    218    217    218            �          0    16390    marks 
   TABLE DATA           6   COPY public.marks (id, name, coordinates) FROM stdin;
    public               postgres    false    218   n
       �           0    0    marks_id_seq    SEQUENCE SET     ;   SELECT pg_catalog.setval('public.marks_id_seq', 16, true);
          public               postgres    false    217            Y           2606    16397    marks marks_pkey 
   CONSTRAINT     N   ALTER TABLE ONLY public.marks
    ADD CONSTRAINT marks_pkey PRIMARY KEY (id);
 :   ALTER TABLE ONLY public.marks DROP CONSTRAINT marks_pkey;
       public                 postgres    false    218            �   �  x�͕�n1���S ft���N��9(�P�N�SŻ׾�_n� ���?��|�_�>?N�����k�t9a����3����Z���I�a��s�RiJV���@ �6H)h � 7��u�RB�[*AǬ^�5$&{Jh	�JS2$�dCB�H%�N+H��.�4������Db5ҝՑr�Rե�� Q�$=$->$�^�K�HT]%�Pf7�40$]]EH�>?4/�E��������hH���jɷC���(V �s˛)�O�l�ֹhj��_S��,8&�^��0IЇ��0T����G:�(㠗��2�h:�Ԧ2�@��B��F)��TS����t��o�(H���!g��е��nU�:%ePg������u�����tg�3#H"d���Yzb,�҉ٖזf;�t��^*9S7a��5��]���8�7t�	g     